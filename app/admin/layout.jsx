import AdminLayout from "@/components/admin/AdminLayout";
import {SignIn } from "@clerk/nextjs";

export default function RootAdminLayout({ children }) {

    return (
        <>
          
                <AdminLayout>
                    {children}
                </AdminLayout>
            
            
                <div className="min-h-screen flex items-center justify-center">
                    <SignIn fallbackRedirectUrl="/admin" routing="hash"/>
                </div>
            
        </>
    );
}
