import QuotesFetcher from "@/components/quotes-fetcher";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <SignedIn>
        <QuotesFetcher />
      </SignedIn>
      
      <SignedOut>
        <Card className="border shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to Quote Generator</CardTitle>
            <CardDescription>
              Sign in to discover, save and share your favorite quotes
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6 py-8">
            <p className="text-center text-muted-foreground max-w-md">
              Create an account to save your favorite quotes and access them from anywhere.
              Your personal collection of wisdom, always at your fingertips.
            </p>
            <SignInButton mode="modal">
              <button className="px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium">
                Sign in to continue
              </button>
            </SignInButton>
          </CardContent>
        </Card>
      </SignedOut>
      <br />
      <div className="w-100 h-auto p-auto m-auto "> 
        <p className="text-center">Copyright Tiavintsoa ANDRIAMAMIVONY</p>
      </div>
    </div>
  );
}