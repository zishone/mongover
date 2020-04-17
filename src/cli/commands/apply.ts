import { apply as coreApply } from '../../core/apply';
import { MongoverOptions } from '../../types/types';
import { getLogger } from '../../utils/get-logger';

const logger = getLogger(__filename);

export async function apply(options: MongoverOptions): Promise<void> {
  try {
    logger.cli('Applying Mongover Specification: %s', options.specPath);
    await coreApply(options);
    logger.cli('Done applying Mongover Specification: %s', options.specPath!.replace(process.cwd(), '.'));
  } catch (error) {
    logger.cli('Error applying Mongover Specification: %O', error);
    throw error;
  }
}
