export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 py-12">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-center text-2xl font-bold text-[#FE2C55]">TikTok Clone</p>
        {children}
      </div>
    </div>
  );
}
