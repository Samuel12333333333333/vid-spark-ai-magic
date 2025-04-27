import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Link } from "react-router-dom";
import { NotificationTester } from '@/components/debug/NotificationTester';

const DashboardHome = () => {
  const { session } = useAuth();
  const { subscription, isLoading } = useSubscription();

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <NotificationTester />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            {session?.user ? (
              <>
                <p>
                  Hello, {session.user.email}! 👋
                </p>
                <Link to="/dashboard/settings" className="inline-block text-primary hover:underline mt-4">
                  Update your profile
                </Link>
              </>
            ) : (
              <Skeleton className="h-4 w-[200px]" />
            )}
          </CardContent>
        </Card>

        {/* Subscription Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-4 w-[200px]" />
            ) : subscription ? (
              <>
                <p>
                  Status: {subscription.status}
                </p>
                <p>
                  Plan: {subscription.plan_name}
                </p>
                <Link to="/dashboard/upgrade" className="inline-block text-primary hover:underline mt-4">
                  Manage subscription
                </Link>
              </>
            ) : (
              <>
                <p>
                  No active subscription.
                </p>
                <Link to="/dashboard/upgrade" className="inline-block text-primary hover:underline mt-4">
                  Explore plans
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Link to="/dashboard/videos" className="text-primary hover:underline">
                View Videos
              </Link>
              <Link to="/dashboard/generator" className="text-primary hover:underline">
                Create New Video
              </Link>
              <Link to="/dashboard/templates" className="text-primary hover:underline">
                Explore Templates
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;
