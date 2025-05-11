import { supabase } from './db';

/**
 * Seed service categories data into Supabase
 */
async function seedServiceCategories() {
  if (!supabase) {
    console.error("Supabase client not available");
    return false;
  }

  console.log("Seeding service categories...");
  const categories = [
    {
      name: "Building & Construction",
      description: "Services related to building, construction, and infrastructure"
    },
    {
      name: "Food & Beverage",
      description: "Services related to food production, catering, and beverages"
    },
    {
      name: "Fashion & Apparel",
      description: "Services related to clothing design, manufacturing, and retail"
    },
    {
      name: "Beauty & Wellness",
      description: "Services related to personal care, beauty, and wellness"
    },
    {
      name: "Media & Creative Arts",
      description: "Services related to content creation, media production, and creative arts"
    }
  ];

  try {
    // Check if categories already exist
    const { data: existingCategories } = await supabase
      .from('service_categories')
      .select('name');
    
    if (existingCategories && existingCategories.length > 0) {
      console.log(`${existingCategories.length} service categories already exist, skipping...`);
      return true;
    }

    // Insert categories
    const { data, error } = await supabase
      .from('service_categories')
      .insert(categories)
      .select();

    if (error) {
      console.error("Error seeding service categories:", error);
      return false;
    }

    console.log(`${data.length} service categories seeded successfully`);
    return true;
  } catch (error) {
    console.error("Exception seeding service categories:", error);
    return false;
  }
}

/**
 * Seed service subcategories data into Supabase
 */
async function seedServiceSubcategories() {
  if (!supabase) {
    console.error("Supabase client not available");
    return false;
  }

  console.log("Fetching service categories to link subcategories...");
  const { data: categories, error: categoriesError } = await supabase
    .from('service_categories')
    .select('id, name');

  if (categoriesError || !categories || categories.length === 0) {
    console.error("Error fetching service categories:", categoriesError);
    return false;
  }

  console.log("Seeding service subcategories...");
  
  // Create a map of category names to IDs for easy lookup
  const categoryMap = categories.reduce((map, category) => {
    map[category.name] = category.id;
    return map;
  }, {} as Record<string, number>);

  // Define subcategories with their parent category names
  const subcategoriesData = [
    {
      categoryName: "Building & Construction",
      subcategories: [
        "Masonry & Bricklaying",
        "Carpentry",
        "Electrical Installation",
        "Plumbing",
        "Painting & Decoration",
        "Roofing",
        "Tiling",
        "Welding & Metal Work"
      ]
    },
    {
      categoryName: "Food & Beverage",
      subcategories: [
        "Catering Services",
        "Baking & Pastry",
        "Food Processing",
        "Restaurant Operations",
        "Beverage Production",
        "Street Food Vending",
        "Food Preservation"
      ]
    },
    {
      categoryName: "Fashion & Apparel",
      subcategories: [
        "Tailoring & Dressmaking",
        "Textile Design",
        "Footwear Production",
        "Accessories Making",
        "Fashion Design",
        "Embroidery",
        "Beadwork & Jewelry"
      ]
    },
    {
      categoryName: "Beauty & Wellness",
      subcategories: [
        "Hairdressing & Barbering",
        "Makeup Artistry",
        "Skincare",
        "Nail Technology",
        "Massage Therapy",
        "Spa Services",
        "Natural Product Creation"
      ]
    },
    {
      categoryName: "Media & Creative Arts",
      subcategories: [
        "Photography",
        "Videography",
        "Graphic Design",
        "Digital Marketing",
        "Music Production",
        "Web Development",
        "Content Creation",
        "Printing & Publishing"
      ]
    }
  ];

  try {
    // Check if subcategories already exist
    const { data: existingSubcategories } = await supabase
      .from('service_subcategories')
      .select('name');
    
    if (existingSubcategories && existingSubcategories.length > 0) {
      console.log(`${existingSubcategories.length} service subcategories already exist, skipping...`);
      return true;
    }

    // Prepare subcategories data
    let subcategories = [];
    for (const category of subcategoriesData) {
      const categoryId = categoryMap[category.categoryName];
      if (!categoryId) {
        console.warn(`Category '${category.categoryName}' not found, skipping subcategories`);
        continue;
      }

      for (const subcategory of category.subcategories) {
        subcategories.push({
          category_id: categoryId,
          name: subcategory,
          description: `${subcategory} services in the ${category.categoryName} category`
        });
      }
    }

    // Insert subcategories in batches to prevent request size limits
    const batchSize = 20;
    for (let i = 0; i < subcategories.length; i += batchSize) {
      const batch = subcategories.slice(i, i + batchSize);
      const { error } = await supabase
        .from('service_subcategories')
        .insert(batch);

      if (error) {
        console.error(`Error seeding subcategories batch ${i/batchSize + 1}:`, error);
        return false;
      }
    }

    console.log(`${subcategories.length} service subcategories seeded successfully`);
    return true;
  } catch (error) {
    console.error("Exception seeding service subcategories:", error);
    return false;
  }
}

/**
 * Seed skills data into Supabase
 */
async function seedSkills() {
  if (!supabase) {
    console.error("Supabase client not available");
    return false;
  }

  console.log("Checking for existing skills...");
  const { data: existingSkills } = await supabase
    .from('skills')
    .select('id');

  if (existingSkills && existingSkills.length > 0) {
    console.log(`${existingSkills.length} skills already exist, skipping...`);
    return true;
  }

  console.log("Fetching service categories and subcategories...");
  const { data: subcategories, error: subcategoriesError } = await supabase
    .from('service_subcategories')
    .select(`
      id, 
      name, 
      category_id, 
      service_categories!inner(id, name)
    `);

  if (subcategoriesError || !subcategories || subcategories.length === 0) {
    console.error("Error fetching service subcategories:", subcategoriesError);
    return false;
  }

  console.log("Seeding skills...");
  
  // Create skills based on subcategories
  const skills = [];
  for (const subcategory of subcategories) {
    // Extract the category name from the nested object
    const categoryName = subcategory.service_categories?.name || '';
    const subcategoryName = subcategory.name;
    
    // Basic skill derived from subcategory
    skills.push({
      name: subcategoryName,
      description: `Skills in ${subcategoryName}`,
      category_id: subcategory.category_id,
      subcategory_id: subcategory.id
    });

    // Additional specialized skills based on the subcategory
    if (subcategoryName === "Digital Marketing") {
      skills.push(
        {
          name: "Social Media Management",
          description: "Skills in managing social media platforms and campaigns",
          category_id: subcategory.category_id,
          subcategory_id: subcategory.id
        },
        {
          name: "SEO Optimization",
          description: "Skills in search engine optimization techniques",
          category_id: subcategory.category_id,
          subcategory_id: subcategory.id
        },
        {
          name: "Content Marketing",
          description: "Skills in creating and distributing content for marketing",
          category_id: subcategory.category_id,
          subcategory_id: subcategory.id
        }
      );
    } else if (subcategoryName === "Web Development") {
      skills.push(
        {
          name: "Front-end Development",
          description: "Skills in creating user interfaces for websites",
          category_id: subcategory.category_id,
          subcategory_id: subcategory.id
        },
        {
          name: "Back-end Development",
          description: "Skills in creating server-side applications",
          category_id: subcategory.category_id,
          subcategory_id: subcategory.id
        },
        {
          name: "Mobile App Development",
          description: "Skills in creating mobile applications",
          category_id: subcategory.category_id,
          subcategory_id: subcategory.id
        }
      );
    } else if (subcategoryName === "Food Processing") {
      skills.push(
        {
          name: "Food Preservation",
          description: "Skills in preserving food products",
          category_id: subcategory.category_id,
          subcategory_id: subcategory.id
        },
        {
          name: "Food Safety Management",
          description: "Skills in ensuring food safety and hygiene",
          category_id: subcategory.category_id,
          subcategory_id: subcategory.id
        }
      );
    } else if (subcategoryName === "Fashion Design") {
      skills.push(
        {
          name: "Pattern Making",
          description: "Skills in creating clothing patterns",
          category_id: subcategory.category_id,
          subcategory_id: subcategory.id
        },
        {
          name: "Garment Construction",
          description: "Skills in constructing garments from patterns",
          category_id: subcategory.category_id,
          subcategory_id: subcategory.id
        }
      );
    }
  }

  try {
    // Insert skills in batches to prevent request size limits
    const batchSize = 20;
    for (let i = 0; i < skills.length; i += batchSize) {
      const batch = skills.slice(i, i + batchSize);
      const { error } = await supabase
        .from('skills')
        .insert(batch);

      if (error) {
        console.error(`Error seeding skills batch ${i/batchSize + 1}:`, error);
        return false;
      }
    }

    console.log(`${skills.length} skills seeded successfully`);
    return true;
  } catch (error) {
    console.error("Exception seeding skills:", error);
    return false;
  }
}

/**
 * Main function to seed all data
 */
async function seedSupabaseData() {
  console.log("Starting Supabase data seeding process...");
  
  // Seed service categories first (they don't depend on other data)
  const categoriesResult = await seedServiceCategories();
  if (!categoriesResult) {
    console.error("Failed to seed service categories");
  }
  
  // Seed subcategories (depends on categories)
  const subcategoriesResult = await seedServiceSubcategories();
  if (!subcategoriesResult) {
    console.error("Failed to seed service subcategories");
  }
  
  // Seed skills (depends on categories and subcategories)
  const skillsResult = await seedSkills();
  if (!skillsResult) {
    console.error("Failed to seed skills");
  }

  console.log("Supabase data seeding process completed");
  return categoriesResult && subcategoriesResult && skillsResult && programsResult;
}

// Execute the function if this script is run directly
const isMainModule = import.meta.url.endsWith(process.argv[1]);
if (isMainModule) {
  seedSupabaseData()
    .then((success) => {
      if (success) {
        console.log("All data seeded successfully");
        process.exit(0);
      } else {
        console.error("Data seeding process failed");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("Error in data seeding process:", error);
      process.exit(1);
    });
}

export { seedSupabaseData };