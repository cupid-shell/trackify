import { useAppContext } from '../context/AppContext';
import { 
  Home, Zap, Flame, Utensils, Car, ShoppingBag, 
  GraduationCap, Bot, HelpCircle, Coins, Briefcase, 
  PiggyBank, Scale, AlertTriangle, User, Shield, 
  Award, Heart, Sparkles, TrendingUp, DollarSign,
  Gift, HeartHandshake, Dumbbell, Stethoscope, Film, Gamepad2, Plane
} from 'lucide-react';

const emojiToLucide = {
  "🏠": Home,
  "⚡": Zap,
  "🔥": Flame,
  "🍔": Utensils,
  "🍕": Utensils,
  "🍜": Utensils,
  "🚗": Car,
  "🚕": Car,
  "🚲": Car,
  "🛒": ShoppingBag,
  "🛍️": ShoppingBag,
  "🎓": GraduationCap,
  "📚": GraduationCap,
  "🤖": Bot,
  "👾": Bot,
  "❓": HelpCircle,
  "🏷️": HelpCircle,
  "💰": Coins,
  "🪙": Coins,
  "💼": Briefcase,
  "🐖": PiggyBank,
  "🐷": PiggyBank,
  "🏦": PiggyBank,
  "⚖️": Scale,
  "⚠️": AlertTriangle,
  "👤": User,
  "🛡️": Shield,
  "🏆": Award,
  "❤️": Heart,
  "✨": Sparkles,
  "📈": TrendingUp,
  "💵": DollarSign,
  "🎁": Gift,
  "🤝": HeartHandshake,
  "🏋️": Dumbbell,
  "🩺": Stethoscope,
  "🎬": Film,
  "🍿": Film,
  "🎮": Gamepad2,
  "✈️": Plane,
};

const nameToLucide = {
  "rent": Home,
  "seat rent": Home,
  "home": Home,
  "house": Home,
  "utility": Zap,
  "utilities": Zap,
  "electricity": Zap,
  "power": Zap,
  "utility bill": Zap,
  "gas": Flame,
  "gas bill": Flame,
  "gas bill (cylinder)": Flame,
  "fuel": Flame,
  "food": Utensils,
  "dining": Utensils,
  "food & dining": Utensils,
  "restaurant": Utensils,
  "cafe": Utensils,
  "snacks": Utensils,
  "transport": Car,
  "transportation": Car,
  "travel": Car,
  "car": Car,
  "taxi": Car,
  "personal": ShoppingBag,
  "personal expenses": ShoppingBag,
  "shopping": ShoppingBag,
  "daily living": ShoppingBag,
  "clothing": ShoppingBag,
  "education": GraduationCap,
  "learning": GraduationCap,
  "books": GraduationCap,
  "college": GraduationCap,
  "university": GraduationCap,
  "ai": Bot,
  "ai subscription": Bot,
  "ai subscriptions": Bot,
  "bot": Bot,
  "other": HelpCircle,
  "unexpected": HelpCircle,
  "miscellaneous": HelpCircle,
  "other / unexpected": HelpCircle,
  "other / miscellaneous": HelpCircle,
  "allowance": Coins,
  "bonus": Coins,
  "salary": Briefcase,
  "job": Briefcase,
  "work": Briefcase,
  "savings": PiggyBank,
  "savings goal": PiggyBank,
  "investment": PiggyBank,
  "debt": Scale,
  "loan": Scale,
  "debt/loan": Scale,
  "repayment": Scale,
  "gift": Gift,
  "charity": HeartHandshake,
  "donation": HeartHandshake,
  "gym": Dumbbell,
  "fitness": Dumbbell,
  "health": Stethoscope,
  "medical": Stethoscope,
  "entertainment": Film,
  "movies": Film,
  "gaming": Gamepad2,
  "games": Gamepad2,
  "traveling": Plane,
  "flight": Plane,
};

export const CategoryIcon = ({ category, emoji: directEmoji, color: directColor, size = 20, className = '' }) => {
  const { getCategoryStyle } = useAppContext();
  
  let emoji = '🏷️';
  let color = '#94a3b8';

  if (category) {
    const style = getCategoryStyle(category);
    emoji = style.emoji || '🏷️';
    color = style.color || '#94a3b8';
  } else if (directEmoji) {
    emoji = directEmoji;
    color = directColor || '#94a3b8';
  }

  const cleanName = category ? category.toLowerCase().trim() : '';
  const { userSettings } = useAppContext();
  const metadata = userSettings?.category_metadata || {};
  const hasCustomEmoji = category && metadata[category] && metadata[category].emoji;

  const LucideIcon = hasCustomEmoji 
    ? (emojiToLucide[emoji] || null)
    : (nameToLucide[cleanName] || emojiToLucide[emoji] || null);

  if (LucideIcon) {
    return (
      <LucideIcon 
        size={size} 
        style={{ 
          color: color, 
          filter: `drop-shadow(0 0 6px ${color}50)`
        }} 
        className={className} 
      />
    );
  }

  return (
    <span 
      className={`category-emoji ${className}`} 
      style={{ 
        fontSize: `${size / 16}rem`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        textShadow: `0 0 12px ${color}80, 0 0 24px ${color}40`,
        filter: 'saturate(1.2) drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {emoji}
    </span>
  );
};

export default CategoryIcon;
