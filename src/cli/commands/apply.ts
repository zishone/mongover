import { apply as coreApply } from '../../core/apply';
import { MongoverOptions } from '../../types/types';
import { getLogger } from '../../utils/get-logger';

const logger = getLogger(__filename);

export async function apply(options: MongoverOptions): Promise<void> {
  try {
    logger.cli('Applying Mongover Specification:\t\t\t%s', options.specPath);
    const client = await coreApply(options);
    logger.cli('Done applying Mongover Specification:\t\t%s', options.specPath);
  } catch (error) {
    logger.cli('Error applying Mongover Specification:\t\t%O', error);
    throw error;
  }
}
