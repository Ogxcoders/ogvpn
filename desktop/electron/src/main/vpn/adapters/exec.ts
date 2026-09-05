/**
 * Minimal child-process runner for the platform adapters and kill switch.
 * Commands come exclusively from the pure builders in vpn/commands.ts and are
 * spawned WITHOUT a shell (no injection surface: every argument is passed
 * verbatim in the argv array).
 */

import { spawn } from 'child_process';
import type { ShellCommand } from '../commands';
import type { ExecFn, ExecOptions, ExecResult } from './types';

export class CommandError extends Error {
  constructor(
    message: string,
    readonly exitCode: number | null,
    readonly stderr: string
  ) {
    super(message);
    this.name = 'CommandError';
  }
}

export const runShell: ExecFn = (
  cmd: ShellCommand,
  opts: ExecOptions = {}
): Promise<ExecResult> => {
  const timeoutMs = opts.timeoutMs ?? 30_000;
  return new Promise<ExecResult>((resolve, reject) => {
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(cmd.command, [...cmd.args], {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (err) {
      reject(new CommandError(`Failed to spawn ${cmd.command}: ${String(err)}`, null, ''));
      return;
    }

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGKILL');
      reject(
        new CommandError(
          `Command timed out after ${timeoutMs}ms: ${cmd.command} ${cmd.args.join(' ')}`,
          null,
          stderr
        )
      );
    }, timeoutMs);

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new CommandError(`Failed to spawn ${cmd.command}: ${err.message}`, null, stderr));
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const tail = stderr.length > 0 ? stderr.slice(-500) : stdout.slice(-200);
        reject(new CommandError(`${cmd.command} exited with code ${code}: ${tail}`, code, stderr));
      }
    });

    if (opts.input !== undefined && child.stdin) {
      child.stdin.write(opts.input);
    }
    child.stdin?.end();
  });
};
