export type ThemeMonthSection = {
  monthNumber: number;
  slug: string;
  label: string;
  description: string;
};

export const themeMonthSections: ThemeMonthSection[] = [
  { monthNumber: 1, slug: "january", label: "January", description: "Open the year with an idea that sets the tone." },
  { monthNumber: 2, slug: "february", label: "February", description: "Keep the theme warm and personal while the year is still fresh." },
  { monthNumber: 3, slug: "march", label: "March", description: "Let the theme stretch into something a little more playful." },
  { monthNumber: 4, slug: "april", label: "April", description: "Look for a version of the theme that feels bright, surprising, or light." },
  { monthNumber: 5, slug: "may", label: "May", description: "Use this month to make the theme feel generous and easy to say yes to." },
  { monthNumber: 6, slug: "june", label: "June", description: "Midyear is a good time for the theme to become a fuller gesture." },
  { monthNumber: 7, slug: "july", label: "July", description: "Give the theme a more spontaneous or summery expression." },
  { monthNumber: 8, slug: "august", label: "August", description: "Keep the theme alive with something that still feels effortless." },
  { monthNumber: 9, slug: "september", label: "September", description: "Shift into a more grounded, thoughtful version of the theme." },
  { monthNumber: 10, slug: "october", label: "October", description: "Lean into texture, atmosphere, or richer interpretations of the theme." },
  { monthNumber: 11, slug: "november", label: "November", description: "Use this month to bridge the theme toward bigger holiday planning." },
  { monthNumber: 12, slug: "december", label: "December", description: "Close the year with a version of the theme that feels memorable." },
];

export function getThemeMonthSection(monthNumber: number) {
  return themeMonthSections.find((section) => section.monthNumber === monthNumber) ?? null;
}
