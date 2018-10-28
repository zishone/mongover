const usage = `
Usage:
mongover <command> [<args>]

  Commands:                       Descriptions:
  help                            - shows usage
  init [<path>]                   - initializes a new Mongover Repository
  apply [<path>]                  - applies the current Mongover Specification to the MongoDB Server
`;

module.exports = {
  help: usage.trim(),
  exit: {
    success: 0,
    error: 1, //generic
    cannotExe: 126, //command invoked cannon execute
    notFound: 127, //command not found
    invalid: 128, //invalid argument
    terminated: 130 //ctrl-c
  }
};
