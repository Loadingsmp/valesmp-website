const Cancel = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 shadow-xl text-center">
        <h1 className="text-3xl font-bold mb-4">Payment Cancelled</h1>
        <p className="text-lg mb-4">
          Your PayPal payment was cancelled. No items were delivered.
        </p>
        <a
          href="/"
          className="inline-block mt-4 px-6 py-3 rounded-lg bg-yellow-500 text-black font-bold"
        >
          Return to Store
        </a>
      </div>
    </div>
  );
};

export default Cancel;