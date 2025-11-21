import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TRPCProvider } from '@/components/TRPCProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from 'react-hot-toast'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { cookies } from 'next/headers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fridge App',
  description: 'Manage your fridge products',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value || 'en'
  const messages = await getMessages({ locale })

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <TRPCProvider>{children}</TRPCProvider>
          </NextIntlClientProvider>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
