import { WinstonModule } from 'nest-winston';
import { LoggerConfig } from './logger-config';

const loggerConfig: LoggerConfig = LoggerConfig.getInstance();
const logger = WinstonModule.createLogger(loggerConfig.console());

export default logger;