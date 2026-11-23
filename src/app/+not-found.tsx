import { Redirect } from 'expo-router';

// Unknown paths (for example when the web build is hosted under another path) go to Today.
export default function NotFound() {
  return <Redirect href="/" />;
}
