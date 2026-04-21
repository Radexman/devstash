import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/auth';
import { getProfileData } from '@/lib/db/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm';
import { DeleteAccountButton } from '@/components/profile/DeleteAccountButton';

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/sign-in');
  }

  const profile = await getProfileData(session.user.id);

  if (!profile) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.hasPassword && (
              <>
                <div>
                  <p className="mb-1 text-sm font-medium">Password</p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Update your account password
                  </p>
                  <ChangePasswordForm />
                </div>
                <Separator />
              </>
            )}

            <div>
              <p className="mb-1 text-sm font-medium text-destructive">
                Danger zone
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
              <DeleteAccountButton />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
