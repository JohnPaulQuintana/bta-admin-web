export default function Dashboard() {
  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-6 mt-14 md:mt-0">
      <div className="text-center max-w-2xl">
        {/* Welcome Message */}
        <h1 className="text-2xl md:text-5xl font-bold text-green-600 mb-6">
          Welcome to Bus Tracker Admin
        </h1>
        
        {/* Subtitle */}
        <p className="text-base md:text-xl text-gray-700 mb-10">
          Manage your transportation system efficiently and effectively
        </p>
        
        {/* Decorative Line */}
        <div className="w-32 h-1 bg-gradient-to-r from-green-600 to-emerald-500 mx-auto mb-6 rounded-full"></div>
        
        {/* Instructions/Quick Actions */}
        <div className="space-y-2 text-gray-600">
          <p className="text-base md:text-lg">
            Use the sidebar to navigate through different sections
          </p>
          <p className="text-base md:text-lg">
            Track buses, manage users, and monitor system performance
          </p>
          <p className="text-base md:text-lg">
            Everything you need is just a click away
          </p>
        </div>
        
        {/* Time/Date */}
        <div className="mt-6 p-4 bg-green-900/90 border border-green-800/30 rounded-xl inline-block">
          <div className="text-2xl font-mono text-green-400">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-sm text-gray-200">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>
    </div>
  );
}