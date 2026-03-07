import knex from 'knex';

export const KnexProvider = {
    provide: 'KNEX',
    useFactory: () => {
        return knex({
            client: 'pg',
            connection: {
                host: process.env.DB_HOST,
                port: Number(process.env.DB_PORT),
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
            },
            pool: {
                min: 2, 
                max: 10,
            },
        });
    }
}