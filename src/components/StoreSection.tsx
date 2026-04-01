import { StoreItem } from "@/lib/store";
import StoreCard from "./StoreCard";
import ScrollReveal from "./ScrollReveal";

interface Props {
  id: string;
  title: string;
  subtitle: string;
  items: StoreItem[];
}

const StoreSection = ({ id, title, subtitle, items }: Props) => {
  return (
    <section id={id} className="py-20 px-4">
      <div className="container mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gradient-gold mb-2">{title}</h2>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((item, i) => (
            <ScrollReveal key={item.id} delay={i * 0.05}>
              <StoreCard item={item} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StoreSection;
