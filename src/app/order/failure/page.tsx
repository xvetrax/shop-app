import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function OrderFailurePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <div className="flex flex-col items-center justify-center space-y-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-8 w-8 text-red-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Payment Failed</h1>
          <p className="text-neutral-600">
            Unfortunately, your payment could not be processed. Please try again or contact us if the problem persists.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/checkout">
            <Button>Try Again</Button>
          </Link>
          <Link href="/products">
            <Button className="bg-neutral-200 text-neutral-900 hover:bg-neutral-300">
              Return to Products
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}



