import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { sessionManager } from "../services/sessionManager.js";

const prisma = new PrismaClient();

const MAIN_PORT = process.env.MAIN_PORT ? parseInt(process.env.MAIN_PORT) : 3002;

export default async function googleAuthRoutes(fastify: FastifyInstance) {
    // Routes pour servir les fichiers CSS et JS avec les bons types MIME
    fastify.get('/auth/style.css', async (request: FastifyRequest, reply: FastifyReply) => {
        const css = `
            body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background-color: #f5f5f5;
            }
            .container {
                text-align: center;
                padding: 2rem;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
        `;
        reply.type('text/css').send(css);
    });

    fastify.get('/auth/main.js', async (request: FastifyRequest, reply: FastifyReply) => {
        const js = `
            console.log('Google Auth page loaded');
        `;
        reply.type('application/javascript').send(js);
    });

    console.log(`🔧 GOOGLE CONFIG - Client ID: ${process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING'}`);
    console.log(`🔧 GOOGLE CONFIG - Client Secret: ${process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING'}`);
    console.log(`🔧 GOOGLE CONFIG - Callback URL: https://localhost:${MAIN_PORT}/api/auth/google/callback`);

    const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `https://localhost:${MAIN_PORT}/api/auth/google/callback`
    );

    fastify.get('/auth/google', async (request: FastifyRequest, reply: FastifyReply) => {
        console.log(`🚀 GOOGLE AUTH - Starting OAuth flow`);
        const authUrl = client.generateAuthUrl({
            access_type: 'offline',
            scope: ['profile', 'email'],
            state: 'google_oauth'
        });

        console.log(`🔗 GOOGLE AUTH - Redirecting to: ${authUrl}`);
        reply.redirect(authUrl);
    });

    // Google OAuth callback
    fastify.get('/auth/google/callback', async (request: FastifyRequest<{
        Querystring: { code?: string; error?: string; state?: string }
    }>, reply: FastifyReply) => {
        try {
            const { code, error, state } = request.query;
            console.log(`🔍 GOOGLE CALLBACK - Received: code=${!!code}, error=${error}, state=${state}`);

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

            // Check if 2FA is enabled before creating JWT
            if (user.isTwoFactorEnabled) {
                // For email 2FA, send code automatically
                if (user.twoFactorType === 'email') {
                    const { generateEmailCode, send2FACodeEmail } = await import('../services/TwoFactorService.js');

                    const code = generateEmailCode();
                    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            twoFactorCode: code,
                            twoFactorCodeExpires: expiresAt,
                        },
                    });

                    await send2FACodeEmail(user.email, code);
                    console.log(`✅ GOOGLE AUTH - Email 2FA code sent to ${user.email}`);
                }

                // Redirect to 2FA verification page with a temporary token
                const tempToken = jwt.sign(
                    {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        temp: true,
                        googleAuth: true
                    },
                    process.env.COOKIE_SECRET || "fallback-secret-key",
                    { expiresIn: '10m' }
                );

                const twoFAScript = `
                    <html>
                    <head><title>Vérification 2FA requise</title></head>
                    <body>
                        <script>
                            // Store temp token and redirect to 2FA page
                            sessionStorage.setItem('googleAuthTempToken', '${tempToken}');
                            sessionStorage.setItem('pending2FAGoogle', 'true');
                            window.location.href = '/2fa-verify';
                        </script>
                        <p>Vérification 2FA requise, redirection...</p>
                    </body>
                    </html>
                `;

                return reply.type('text/html').send(twoFAScript);
            }

            // Create JWT token (only if 2FA is disabled) - consistent with regular login
            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                },
                process.env.COOKIE_SECRET || "fallback-secret-key",
                { expiresIn: "24h" }
            );

            // Set secure cookie
            reply.setCookie('authToken', token, {
                httpOnly: true,
                secure: false, // Désactivé pour le développement local
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            // Redirect script for successful login (only when 2FA is disabled)
            const redirectScript = `
                <html>
                <head><title>Connexion réussie</title></head>
                <body>
                    <script>
                        // Store token and user info
                        sessionStorage.setItem('authToken', '${token}');
                        sessionStorage.setItem('username', '${user.username}');
                        sessionStorage.setItem('currentUser', JSON.stringify({
                            id: ${user.id},
                            username: '${user.username}',
                            email: '${user.email}',
                            avatarUrl: '${user.avatarUrl || ''}'
                        }));

                        // Redirect to game page
                        window.location.href = '/game';
                    </script>
                    <p>Connexion réussie, redirection...</p>
                </body>
                </html>
            `;

			const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
			sessionManager.addSession(user.username, user.id, expiresAt);

            reply.type('text/html').send(redirectScript);

        } catch (error) {
            console.error('❌ GOOGLE OAUTH ERROR:', error);
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

            // Check if 2FA is enabled before creating JWT
            if (user.isTwoFactorEnabled) {
                // For email 2FA, send code automatically
                if (user.twoFactorType === 'email') {
                    const { generateEmailCode, send2FACodeEmail } = await import('../services/TwoFactorService.js');

                    const code = generateEmailCode();
                    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            twoFactorCode: code,
                            twoFactorCodeExpires: expiresAt,
                        },
                    });

                    await send2FACodeEmail(user.email, code);
                    console.log(`✅ GOOGLE VERIFY - Email 2FA code sent to ${user.email}`);
                }

                return reply.status(200).send({
                    success: false,
                    requires2FA: true,
                    message: "Google account requires 2FA verification",
                    twoFactorType: user.twoFactorType,
                    tempUserId: user.id
                });
            }

            // Create JWT token (only if 2FA is disabled) - consistent with regular login
            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                },
                process.env.COOKIE_SECRET || "fallback-secret-key",
                { expiresIn: "24h" }
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

    // Google 2FA verification endpoint
    fastify.post('/auth/google/verify-2fa', async (request: FastifyRequest<{
        Body: { tempToken: string; twoFactorToken: string }
    }>, reply: FastifyReply) => {
        try {
            const { tempToken, twoFactorToken } = request.body;

            if (!tempToken || !twoFactorToken) {
                return reply.status(400).send({
                    success: false,
                    message: 'Temporary token and 2FA token required'
                });
            }

            // Verify the temporary token
            let decoded: any;
            try {
                decoded = jwt.verify(tempToken, process.env.COOKIE_SECRET || "fallback-secret-key");
            } catch (error) {
                return reply.status(401).send({
                    success: false,
                    message: 'Invalid or expired temporary token'
                });
            }

            if (!decoded.temp || !decoded.googleAuth) {
                return reply.status(401).send({
                    success: false,
                    message: 'Invalid temporary token'
                });
            }

            // Get user from database
            const user = await prisma.user.findUnique({
                where: { id: decoded.id }
            });

            if (!user || !user.isTwoFactorEnabled) {
                return reply.status(404).send({
                    success: false,
                    message: 'User not found or 2FA not enabled'
                });
            }

            // Verify 2FA token based on type
            const { verifyTOTPCode, verifyEmailCode } = await import('../services/TwoFactorService.js');

            let is2FAValid = false;

            if (user.twoFactorType === 'totp' && user.twoFactorSecret) {
                is2FAValid = verifyTOTPCode(user.twoFactorSecret, twoFactorToken);
            } else if (user.twoFactorType === 'email') {
                is2FAValid = verifyEmailCode(user, twoFactorToken);
            }

            if (!is2FAValid) {
                return reply.status(401).send({
                    success: false,
                    message: 'Invalid 2FA token'
                });
            }

            // Clear email 2FA code after successful verification and set connected status
            if (user.twoFactorType === 'email') {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        twoFactorCode: null,
                        twoFactorCodeExpires: null,
                        connected: true,
                    },
                });
            } else {
                // For TOTP, just update connected status
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        connected: true,
                    },
                });
            }

            // Create final JWT token (consistent with regular login)
            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                },
                process.env.COOKIE_SECRET || "fallback-secret-key",
                { expiresIn: "24h" }
            );

            // Set secure cookie
            reply.setCookie('authToken', token, {
                httpOnly: true,
                secure: false, // Disabled for local development
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            // Add session to session manager for consistency with regular login
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const { sessionManager } = await import('../services/sessionManager.js');
            sessionManager.addSession(user.username, user.id, expiresAt);

            console.log(`✅ GOOGLE 2FA - Session created for ${user.username}`);

            reply.send({
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    avatarUrl: user.avatarUrl,
                    twoFactorEnabled: user.isTwoFactorEnabled
                }
            });

        } catch (error) {
            console.error('Google 2FA verification error:', error);
            reply.status(500).send({ success: false, message: 'Internal server error' });
        }
    });
}