import app from './app';
import { Config } from './config';
import { AppDataSource } from './config/data-source';
import logger from './config/logger';

const startServer = async () => {
    const PORT = Config.PORT;
    try {
        await AppDataSource.initialize();
        logger.info('Db Connected!');
        app.listen(PORT, () => {
            logger.info(`Listening on port: ${PORT}`);
        });
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

void startServer();
