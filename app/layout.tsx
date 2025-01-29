import Script from 'next/script'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster';
import { ProModal } from '@/components/pro-modal';
import GoogleAnalytics from '@/components/GoogleAnalytics';

import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
 title: 'Companion.AI',
 description: 'Your customized companion.',
}

export default function RootLayout({
 children,
}: {
 children: React.ReactNode
}) {
 return (
   <ClerkProvider>
     <html lang="en" suppressHydrationWarning>
       <head>
         <Script 
           src="https://checkout.razorpay.com/v1/checkout.js"
           strategy="beforeInteractive"
         />
         <GoogleAnalytics />
       </head>
       <body className={cn("bg-secondary", inter.className)}>
         <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
           <div className="flex">
             {/* Main content with margin-left */}
             <main className="flex-1 ml-64">
               <ProModal />
               {children}
               <Toaster />
             </main>
           </div>
         </ThemeProvider>
       </body>
     </html>
   </ClerkProvider>
 )
}