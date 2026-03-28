import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * Enhanced TagFilter Component
 * 
 * @param {Object|Array} tags - Map of tags to counts {react: 5} or Array of strings
 * @param {string[]} selectedTags - List of currently selected tags
 * @param {Function} onToggle - Callback function when a tag is clicked
 * @param {number} limit - Initial number of tags to show
 */
const TagFilter = ({ tags = {}, selectedTags = [], onToggle, limit = 5 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Normalize tags to [name, count] entries
    const tagEntries = Array.isArray(tags) 
        ? tags.map(t => [t, null]) 
        : Object.entries(tags);

    if (tagEntries.length === 0) return null;

    const visibleTags = isExpanded ? tagEntries : tagEntries.slice(0, limit);
    const hasMore = tagEntries.length > limit;

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
                {visibleTags.map(([tag, count]) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                        <Badge
                            key={tag}
                            variant={isSelected ? "default" : "outline"}
                            className={cn(
                                "cursor-pointer rounded-full px-4 py-1.5 transition-all select-none text-sm",
                                isSelected 
                                    ? "shadow-sm border-primary" 
                                    : "bg-background text-muted-foreground border-muted-foreground/30 hover:border-primary/50"
                            )}
                            onClick={() => onToggle(tag)}
                        >
                            {tag}
                            {count !== null && (
                                <span className={cn(
                                    "ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                                    isSelected ? "bg-primary-foreground/20" : "bg-muted"
                                )}>
                                    {count}
                                </span>
                            )}
                        </Badge>
                    );
                })}
                
                {hasMore && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-8 rounded-full text-xs text-primary hover:bg-primary/5 px-3"
                    >
                        {isExpanded ? (
                            <><ChevronUp className="mr-1 h-3 w-3" /> Show Less</>
                        ) : (
                            <><ChevronDown className="mr-1 h-3 w-3" /> {tagEntries.length - limit} More</>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default TagFilter;
