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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Header */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600 mb-8">Manage your account settings</p>

          {/* Profile Image Section */}
          <div className="flex flex-col items-center mb-8">
            <ImageUpload
              onImageUpload={handleImageUpload}
              onImageDelete={handleImageDelete}
              currentImage={user?.profileImage}
              size="lg"
            />
          </div>

          {/* User Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {user?.name}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {user?.email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business
              </label>
              <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {user?.businessName}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan
              </label>
              <div
                className={`
                px-3 py-2 rounded-lg capitalize font-medium
                ${
                  user?.plan === "professional"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }
              `}
              >
                {user?.plan}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
