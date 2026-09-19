import React from "react";

export default function PageHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-9 h-9 rounded-xl ocean-gradient flex items-center justify-center">
              <Icon className="w-4.5 h-4.5 text-white" />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">{title}</h1>
        </div>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}