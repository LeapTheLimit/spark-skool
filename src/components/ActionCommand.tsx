interface CommandAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  handler: () => Promise<void>;
}

export default function ActionCommand({ title, description, icon, handler }: CommandAction) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <button 
        onClick={handler}
        className="flex items-center gap-3 w-full"
      >
        <div className="p-2 bg-gray-100 rounded-lg">{icon}</div>
        <div className="text-left">
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </button>
    </div>
  );
} 