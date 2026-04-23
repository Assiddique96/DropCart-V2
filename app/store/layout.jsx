import StoreLayout from "@/components/store/StoreLayout";
import { SignIn, Show } from "@clerk/nextjs";

export const metadata = {
    title: "Shpinx. - Store Dashboard",
    description: "Shpinx. - Store Dashboard",
};

export default function RootStoreLayout({ children }) {

    return (
        <Show 
            when="signed-in"
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <SignIn fallbackRedirectUrl="/store" routing="hash"/>
                </div>
            }
        >
            <StoreLayout>
                {children}
            </StoreLayout>
        </Show>
    );
}
