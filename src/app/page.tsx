import { HomeContent } from "./home-content";
import { subscribe } from "./subscribe/actions";

export default function HomePage() {
  return <HomeContent subscribeAction={subscribe} />;
}
