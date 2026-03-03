import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import GolfLayout from "./components/GolfLayout";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import NewRound from "./pages/NewRound";
import RoundDetail from "./pages/RoundDetail";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import AIAssistant from "./pages/AIAssistant";

function Router() {
  return (
    <GolfLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/courses" component={Courses} />
        <Route path="/rounds/new" component={NewRound} />
        <Route path="/rounds/:id" component={RoundDetail} />
        <Route path="/history" component={History} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/ai" component={AIAssistant} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </GolfLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
