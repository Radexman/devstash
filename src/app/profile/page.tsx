import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Mail, User } from 'lucide-react';
import { auth } from '@/auth';
import { getProfileData, getProfileStats } from '@/lib/db/users';
import { iconMap } from '@/lib/item-icons';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm';
import { DeleteAccountButton } from '@/components/profile/DeleteAccountButton';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/sign-in');
  }

  const [profile, stats] = await Promise.all([
    getProfileData(session.user.id),
    getProfileStats(session.user.id),
  ]);

  if (!profile) {
    redirect('/sign-in');
  }

  const joinDate = profile.createdAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        <h1 className="text-2xl font-bold">Profile</h1>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <UserAvatar
                name={profile.name}
                image={profile.image}
                className="h-16 w-16"
                size="lg"
              />
              <div className="space-y-1">
                <p className="text-lg font-medium">
                  {profile.name ?? 'User'}
                </p>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  {profile.email}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {joinDate}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-2xl font-bold">{stats.totalItems}</p>
                <p className="text-xs text-muted-foreground">Total Items</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-2xl font-bold">{stats.totalCollections}</p>
                <p className="text-xs text-muted-foreground">
                  Total Collections
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                Items by type
              </p>
              <div className="space-y-1.5">
                {stats.itemsByType.map((type) => {
                  const Icon = iconMap[type.icon];
                  return (
                    <div
                      key={type.name}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {Icon && (
                          <Icon
                            className="h-4 w-4"
                            style={{ color: type.color }}
                          />
                        )}
                        <span>{type.name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {type.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
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
