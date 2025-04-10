
import { Navigate } from "react-router-dom";

// The Index component serves as the entry point
// We'll redirect to the landing page
const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;
