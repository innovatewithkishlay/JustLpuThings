import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { pool } from '../../config/db';
import { env } from '../../config/env';

passport.use(
    new GoogleStrategy(
        {
            clientID: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            callbackURL: env.GOOGLE_CALLBACK_URL,
        },
        async (_accessToken, _refreshToken, profile: Profile, done) => {
            try {
                const googleId = profile.id;
                const email = profile.emails?.[0]?.value;
                const name = profile.displayName;
                const avatarUrl = profile.photos?.[0]?.value;

                if (!email) return done(null, false);

                // 1. Find by google_id
                let result = await pool.query(
                    'SELECT id, role FROM users WHERE google_id = $1',
                    [googleId]
                );

                if (result.rowCount && result.rowCount > 0) {
                    return done(null, result.rows[0]);
                }

                // 2. Find by email (user may have registered with email previously)
                result = await pool.query(
                    'SELECT id, role FROM users WHERE email = $1',
                    [email]
                );

                if (result.rowCount && result.rowCount > 0) {
                    // Link google_id and update avatar
                    await pool.query(
                        'UPDATE users SET google_id = $1, avatar_url = $2, name = COALESCE(name, $3) WHERE id = $4',
                        [googleId, avatarUrl, name, result.rows[0].id]
                    );
                    return done(null, result.rows[0]);
                }

                // 3. Create new user (no password_hash for OAuth users)
                const newUser = await pool.query(
                    `INSERT INTO users (name, email, google_id, avatar_url, role)
                     VALUES ($1, $2, $3, $4, 'USER')
                     RETURNING id, role`,
                    [name, email, googleId, avatarUrl]
                );

                return done(null, newUser.rows[0]);
            } catch (err) {
                return done(err as Error);
            }
        }
    )
);

export default passport;
