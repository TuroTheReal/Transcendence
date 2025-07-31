import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const MAIN_PORT = process.env.MAIN_PORT ? parseInt(process.env.MAIN_PORT) : 3002;

export default async function googleAuthRoutes(fastify: FastifyInstance) {
    // Debug pour vérifier les variables d'environnement
    console.log('🔍 Google OAuth Config:');
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Défini' : 'NON DÉFINI');
    console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Défini' : 'NON DÉFINI');
    console.log('Callback URL:', `https://localhost:${MAIN_PORT}/api/auth/google/callback`);

    const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `https://localhost:${MAIN_PORT}/api/auth/google/callback`
    );

    // Google OAuth login initiation
    fastify.get('/auth/google', async (request: FastifyRequest, reply: FastifyReply) => {
        const authUrl = client.generateAuthUrl({
            access_type: 'offline',
            scope: ['profile', 'email'],
            state: 'google_oauth'
        });
        
        reply.redirect(authUrl);
    });

    // Google OAuth callback
    fastify.get('/auth/google/callback', async (request: FastifyRequest<{
        Querystring: { code?: string; error?: string; state?: string }
    }>, reply: FastifyReply) => {
        try {
            const { code, error, state } = request.query;

            if (error) {
                return reply.redirect('/login?error=oauth_cancelled');
            }

            if (!code || state !== 'google_oauth') {
                return reply.redirect('/login?error=invalid_oauth_state');
            }

            // Exchange code for tokens
            const { tokens } = await client.getToken(code);
            client.setCredentials(tokens);

            // Get user info from Google
            const ticket = await client.verifyIdToken({
                idToken: tokens.id_token!,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();
            if (!payload) {
                return reply.redirect('/login?error=invalid_token');
            }

            const { sub: googleId, email, name, picture } = payload;

            if (!email) {
                return reply.redirect('/login?error=no_email');
            }

            // Check if user exists
            let user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { googleId: googleId },
                        { email: email }
                    ]
                }
            });

            if (!user) {
                // Create new user
                const username = email.split('@')[0];
                
                user = await prisma.user.create({
                    data: {
                        username,
                        email,
                        googleId,
                        avatarUrl: picture || null,
                        connected: true,
                        passwordHash: null // No password for Google users
                    }
                });
            } else {
                // Update existing user with Google info if not set
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        googleId: user.googleId || googleId,
                        avatarUrl: user.avatarUrl || picture,
                        connected: true
                    }
                });
            }

            // Create JWT token
            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username,
                    email: user.email 
                },
                process.env.COOKIE_SECRET || 'fallback-secret',
                { expiresIn: '7d' }
            );

            // Set secure cookie
            reply.setCookie('authToken', token, {
                httpOnly: true,
                secure: false, // Désactivé pour le développement local
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            // Aussi stocker en sessionStorage pour le frontend via un script
            const redirectScript = `
                <html>
                <head><title>Connexion réussie</title></head>
                <body>
                    <script>
                        // Stocker le token et les infos utilisateur complètes
                        sessionStorage.setItem('authToken', '${token}');
                        sessionStorage.setItem('username', '${user.username}');
                        sessionStorage.setItem('currentUser', JSON.stringify({
                            id: ${user.id},
                            username: '${user.username}',
                            email: '${user.email}',
                            avatarUrl: '${user.avatarUrl || ''}'
                        }));
                        
                        // Émettre un événement pour notifier l'application de la connexion
                        window.addEventListener('load', function() {
                            // Forcer la revalidation de l'auth dans l'application
                            if (window.opener) {
                                window.opener.location.reload();
                                window.close();
                            } else {
                                // Rediriger avec un paramètre pour indiquer la connexion réussie
                                window.location.href = '/game?auth=success';
                            }
                        });
                    </script>
                    <p>Connexion réussie, redirection...</p>
                </body>
                </html>
            `;
            
            reply.type('text/html').send(redirectScript);

        } catch (error) {
            console.error('Google OAuth error:', error);
            reply.redirect('/login?error=oauth_failed');
        }
    });

    // Verify Google token endpoint (for frontend)
    fastify.post('/auth/google/verify', async (request: FastifyRequest<{
        Body: { credential: string }
    }>, reply: FastifyReply) => {
        try {
            const { credential } = request.body;

            if (!credential) {
                return reply.status(400).send({ success: false, message: 'No credential provided' });
            }

            // Verify the Google ID token
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();
            if (!payload) {
                return reply.status(400).send({ success: false, message: 'Invalid token' });
            }

            const { sub: googleId, email, name, picture } = payload;

            if (!email) {
                return reply.status(400).send({ success: false, message: 'No email in token' });
            }

            // Check if user exists
            let user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { googleId: googleId },
                        { email: email }
                    ]
                }
            });

            if (!user) {
                // Create new user
                const username = email.split('@')[0];
                
                user = await prisma.user.create({
                    data: {
                        username,
                        email,
                        googleId,
                        avatarUrl: picture || null,
                        connected: true,
                        passwordHash: null // No password for Google users
                    }
                });
            } else {
                // Update existing user
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        googleId: user.googleId || googleId,
                        avatarUrl: user.avatarUrl || picture,
                        connected: true
                    }
                });
            }

            // Create JWT token
            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username,
                    email: user.email 
                },
                process.env.COOKIE_SECRET || 'fallback-secret',
                { expiresIn: '7d' }
            );

            // Set secure cookie
            reply.setCookie('authToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            reply.send({
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    avatarUrl: user.avatarUrl
                }
            });

        } catch (error) {
            console.error('Google token verification error:', error);
            reply.status(500).send({ success: false, message: 'Token verification failed' });
        }
    });
}