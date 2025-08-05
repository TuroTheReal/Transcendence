declare module 'bcrypt' {
  export function hash(data: string, saltOrRounds: number | string): Promise<string>;
  export function compare(data: string, encrypted: string): Promise<boolean>;
  export function genSalt(rounds?: number): Promise<string>;
}

declare module 'jsonwebtoken' {
  export interface SignOptions {
    expiresIn?: string | number;
    algorithm?: string;
  }
  export function sign(payload: any, secretOrPrivateKey: string, options?: SignOptions): string;
  export function verify(token: string, secretOrPublicKey: string): any;
}

declare module 'nodemailer' {
  export interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  }
  export function createTransport(options: TransportOptions): any;
}

declare module 'speakeasy' {
  export interface GenerateSecretOptions {
    name?: string;
    length?: number;
  }
  export interface TOTPVerifyOptions {
    secret: string;
    encoding?: string;
    token: string;
    window?: number;
  }
  export function generateSecret(options?: GenerateSecretOptions): any;
  export namespace totp {
    export function verify(options: TOTPVerifyOptions): boolean;
  }
}