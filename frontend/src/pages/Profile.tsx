import { useAuth } from "../utils/AuthContext";
import ImageUpload from "../components/ImageUpload";

const Profile = () => {
  const { user, refreshUser } = useAuth();

  const handleImageUpload = async (imageUrl: string) => {
    console.log("Image uploaded:", imageUrl);
    await refreshUser();
  };

  const handleImageDelete = async () => {
    console.log("Image deleted");
    await refreshUser();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-md mx-auto relative z-10">
        {/* Profile Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
              Profile
            </h1>
            <p className="text-gray-400">Manage your account settings</p>
          </div>

          {/* Profile Image Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-lg group-hover:bg-cyan-400/30 transition-all duration-300"></div>
              <ImageUpload
                onImageUpload={handleImageUpload}
                onImageDelete={handleImageDelete}
                currentImage={user?.profileImage}
                size="lg"
              />
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-3">
                Name
              </label>
              <div className="text-white bg-white/5 border border-white/10 px-4 py-3 rounded-xl backdrop-blur-sm">
                {user?.name}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-3">
                Email
              </label>
              <div className="text-white bg-white/5 border border-white/10 px-4 py-3 rounded-xl backdrop-blur-sm">
                {user?.email}
              </div>
            </div>

            {/* Business */}
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-3">
                Business
              </label>
              <div className="text-white bg-white/5 border border-white/10 px-4 py-3 rounded-xl backdrop-blur-sm">
                {user?.businessName || "Not specified"}
              </div>
            </div>

            {/* Plan */}
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-3">
                Plan
              </label>
              <div
                className={`
                  px-4 py-3 rounded-xl capitalize font-semibold border backdrop-blur-sm
                  ${
                    user?.plan === "professional"
                      ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30"
                      : user?.plan === "master"
                      ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30"
                      : "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span>{user?.plan}</span>
                  {user?.plan === "professional" && (
                    <span className="text-green-400 text-lg">⭐</span>
                  )}
                </div>
              </div>
            </div>

            {/* Subscription Status */}
            {user?.subscriptionStatus && (
              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-3">
                  Subscription Status
                </label>
                <div
                  className={`
                    px-4 py-3 rounded-xl font-semibold border backdrop-blur-sm
                    ${
                      user.subscriptionStatus === "active"
                        ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30"
                        : "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border-yellow-500/30"
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="capitalize">
                      {user.subscriptionStatus}
                    </span>
                    {user.subscriptionStatus === "active" ? (
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    ) : (
                      <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-center text-gray-400 text-sm">
              Contact support to update your account information
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
