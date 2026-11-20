import { Link, Tooltip } from '@mui/material';
import { renderLog } from '../../common/utils/logging';
import { pipelineCommitUrl } from '../../utils/runUtils';

/** The pipeline version that made a capture or pass, as "0.1.0 (e089304)" with the commit linked to GitHub. */
export default function CodeVersion ({ version, gitSha }: { version: string | null; gitSha: string | null }) {
  renderLog('CodeVersion');
  if (!gitSha) return <>{version ?? 'unknown'}</>;
  const commit = (
    <Tooltip title={`state-roster-pipeline commit ${gitSha}`}>
      <Link href={pipelineCommitUrl(gitSha)} target="_blank" rel="noreferrer">{gitSha.slice(0, 7)}</Link>
    </Tooltip>
  );
  return version ? <>{version} ({commit})</> : commit;
}
