import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skill } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CheckIcon, PlusCircle, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface SkillsSelectionProps {
  selectedSkills: SelectedSkill[];
  onChange: (skills: SelectedSkill[]) => void;
}

export interface SelectedSkill {
  id: number;
  name: string;
  proficiency: string;
  isPrimary: boolean;
  yearsOfExperience: number;
}

export function SkillsSelection({ selectedSkills, onChange }: SkillsSelectionProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [editSkillId, setEditSkillId] = useState<number | null>(null);

  // Fetch all available skills
  const { data: availableSkills, isLoading } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get skills that haven't been selected yet
  const unselectedSkills = availableSkills?.filter(
    (skill) => !selectedSkills.some((s) => s.id === skill.id)
  ) || [];

  // Filter skills based on search input
  const filteredSkills = searchValue
    ? unselectedSkills.filter((skill) =>
        skill.name.toLowerCase().includes(searchValue.toLowerCase())
      )
    : unselectedSkills;

  // Add a selected skill with default values
  const addSkill = (skill: Skill) => {
    const newSkill: SelectedSkill = {
      id: skill.id,
      name: skill.name,
      proficiency: "Intermediate",
      isPrimary: selectedSkills.length === 0, // First skill is primary by default
      yearsOfExperience: 0,
    };
    onChange([...selectedSkills, newSkill]);
    setOpen(false);
    setSearchValue("");
    
    // Start editing the newly added skill
    setEditSkillId(skill.id);
  };

  // Remove a skill
  const removeSkill = (skillId: number) => {
    onChange(selectedSkills.filter((s) => s.id !== skillId));
    if (editSkillId === skillId) {
      setEditSkillId(null);
    }
  };

  // Update skill properties
  const updateSkill = (skillId: number, updates: Partial<SelectedSkill>) => {
    onChange(
      selectedSkills.map((skill) => {
        if (skill.id === skillId) {
          return { ...skill, ...updates };
        }
        
        // If setting this skill as primary, make all others non-primary
        if (updates.isPrimary && updates.isPrimary === true) {
          return { ...skill, isPrimary: skill.id === skillId };
        }
        
        return skill;
      })
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-sm font-medium mb-1">Skills ({selectedSkills.length})</h4>
          <p className="text-xs text-muted-foreground">
            Select skills from our database or add custom skills
          </p>
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="h-8 flex items-center"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1" />
              Add Skill
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="end" side="bottom" sideOffset={5}>
            <Command>
              <CommandInput 
                placeholder="Search skills..." 
                value={searchValue}
                onValueChange={setSearchValue}
              />
              {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Loading skills...
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    {searchValue.trim() !== "" ? (
                      <div className="py-3 px-4 text-center text-sm">
                        No skills found for "{searchValue}"
                      </div>
                    ) : (
                      <div className="py-3 px-4 text-center text-sm">
                        Type to search skills
                      </div>
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-[200px]">
                      {filteredSkills.map((skill) => (
                        <CommandItem
                          key={skill.id}
                          value={skill.name}
                          onSelect={() => addSkill(skill)}
                          className="cursor-pointer"
                        >
                          {skill.name}
                          <span className="ml-auto opacity-70 text-xs">
                            {skill.description}
                          </span>
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                </>
              )}
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Display selected skills */}
      <div className="space-y-2">
        {selectedSkills.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No skills selected. Add skills to indicate proficiency.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedSkills.map((skill) => (
              <div 
                key={skill.id} 
                className={cn(
                  "border rounded-md p-3 relative",
                  editSkillId === skill.id ? "border-primary/50 bg-primary/5" : "border-border"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{skill.name}</span>
                    {skill.isPrimary && (
                      <Badge variant="secondary" className="text-xs">Primary</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => editSkillId === skill.id 
                        ? setEditSkillId(null) 
                        : setEditSkillId(skill.id)
                      }
                    >
                      {editSkillId === skill.id ? (
                        <CheckIcon className="h-3.5 w-3.5" />
                      ) : (
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="14" 
                          height="14" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="opacity-50"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                          <path d="m15 5 4 4"/>
                        </svg>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeSkill(skill.id)}
                    >
                      <X className="h-3.5 w-3.5 opacity-50" />
                    </Button>
                  </div>
                </div>
                
                {editSkillId === skill.id && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">
                        Proficiency
                      </label>
                      <Select
                        defaultValue={skill.proficiency}
                        onValueChange={(value) => 
                          updateSkill(skill.id, { proficiency: value })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select proficiency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                          <SelectItem value="Expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">
                        Years of Experience
                      </label>
                      <Input
                        type="number"
                        className="h-8"
                        min={0}
                        value={skill.yearsOfExperience}
                        onChange={(e) => 
                          updateSkill(skill.id, { 
                            yearsOfExperience: parseInt(e.target.value) || 0 
                          })
                        }
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-8 w-full",
                          skill.isPrimary && "bg-primary/10 border-primary/30"
                        )}
                        onClick={() => 
                          updateSkill(skill.id, { isPrimary: !skill.isPrimary })
                        }
                      >
                        {skill.isPrimary ? "Primary Skill ✓" : "Set as Primary"}
                      </Button>
                    </div>
                  </div>
                )}
                
                {editSkillId !== skill.id && (
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Proficiency: {skill.proficiency}</span>
                    <span>Experience: {skill.yearsOfExperience} year(s)</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}