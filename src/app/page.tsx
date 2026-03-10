import Hero from "@/components/Hero/Hero";
import Testimonials from "@/components/Testimonials/Testimonials";
import Navbar from "@/components/navbar/Navbar";
import PlanCard from "@/components/Plans/PlanCard";
import { getAuthSession } from "@/lib/auth";

const MOCK_PLANS: SubscriptionPlan[] = [
  {
    id: "1",
    name: "Starter",
    price: 49,
    stripePriceId: "price_starter",
    descriptionPoints: ["1 Project", "Basic Analytics", "Email Support"],
  },
  {
    id: "2",
    name: "Pro",
    price: 99,
    stripePriceId: "price_pro",
    descriptionPoints: ["Unlimited Projects", "Advanced Analytics", "24/7 Support"],
  },
];

export default async function Home() {
  const session = await getAuthSession();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        
        <section id="pricing" className="py-20 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Pricing Plans
            </h2>
            <p className="mt-4 text-xl text-gray-400">
              Choose the perfect plan for your business needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto px-4">
            {MOCK_PLANS.map((plan) => (
              <PlanCard 
                key={plan.id} 
                plan={plan} 
                session={session || { user: {} }} 
                subscriptionPlan={{ isSubscribed: false }} 
              />
            ))}
          </div>
        </section>

        <Testimonials />
      </main>

      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
          <p>© 2026 ShipFast. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
