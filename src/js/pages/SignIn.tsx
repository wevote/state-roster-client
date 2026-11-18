import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { renderLog } from '../common/utils/logging';
import { signIn } from '../react-query/RosterQuery';

/** Shown instead of the console until someone signs in. Users are added with the CLI's --add-user. */
export default function SignIn () {
  renderLog('SignIn');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [sending, setSending] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);

  async function submit (e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setRefusal(null);
    try {
      await signIn(userName.trim(), password);
    } catch (error) {
      setRefusal(error instanceof Error ? error.message : String(error));
      setSending(false);
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: { xs: 4, md: 10 } }}>
      <Paper variant="outlined" sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <form onSubmit={submit}>
          <Typography sx={{ color: 'secondary.main', fontWeight: 500, fontSize: '1.4rem', mb: 2 }}>Sign in</Typography>
          <TextField label="User name" value={userName} onChange={(e) => setUserName(e.target.value)} autoComplete="username" autoFocus fullWidth sx={{ mb: 2 }} />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" fullWidth />
          {refusal && <Alert severity="error" sx={{ mt: 2 }}>{refusal}</Alert>}
          <Button type="submit" variant="contained" fullWidth disabled={sending || userName.trim() === '' || password === ''} sx={{ mt: 3 }}>
            {sending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
