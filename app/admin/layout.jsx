import AdminLayout from "@/components/admin/AdminLayout";
import { SignIn, Show } from "@clerk/nextjs";

export default function RootAdminLayout({ children }) {

    return (
        <Show 
            when="signed-in"
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <SignIn fallbackRedirectUrl="/admin" routing="hash"/>
                </div>
            }
        >
            <AdminLayout>
                {children}
            </AdminLayout>
        </Show>
    );
}
