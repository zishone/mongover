import {
  debug,
  Debugger,
} from 'debug';

interface Logger {
  debug: Debugger;
  info: Debugger;
  warn: Debugger;
  error: Debugger;
  cli: Debugger;
}

export function getLogger(fileName: string): Logger {
  const component = fileName.split('.')[0].split('/').pop();
  return {
    debug: debug(`mongover:debug:${component}`),
    info: debug(`mongover:info:${component}`),
    warn: debug(`mongover:warn:${component}`),
    error: debug(`mongover:error:${component}`),
    cli: debug(`cli:mongover`),
  };
}
