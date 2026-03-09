export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white gap-4">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      <span className="text-sm text-gray-500 tracking-wide">Loading...</span>
    </div>
  );
}
