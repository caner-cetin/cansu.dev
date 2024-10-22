import type { Dayjs } from "dayjs";
import type { Generated } from "kysely";

export interface SubmissionsTable {
	id: Generated<number>;
	judgetoken: string;
	sourcecode: string;
	stdin: string | undefined;
	sent: boolean;
	createdat: Dayjs | undefined;
	updatedat: Dayjs | undefined;
	deletedat: Dayjs | undefined;
}
