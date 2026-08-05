import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Tab Navigation Error Catch:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-12 neu-card text-center space-y-4">
          <div className="text-amber-800 text-sm font-extrabold uppercase tracking-widest">
            Tab Reload Notice
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Page View Initializing
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            The data view is updating. Click below to refresh this tab view cleanly.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-5 py-2.5 bg-slate-950 text-amber-300 font-bold text-xs rounded-xl shadow-md hover:bg-slate-900 transition-all"
          >
            Reload Tab View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
