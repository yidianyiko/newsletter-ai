import { HomeContent } from "./home-content";
import { subscribe } from "./subscribe/actions";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state } = await searchParams;
  return <HomeContent subscribeAction={subscribe} state={state} />;
}
