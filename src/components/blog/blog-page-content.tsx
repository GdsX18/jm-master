"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { BlogHero } from "@/components/blog/blog-hero";
import { BlogListing } from "@/components/blog/blog-listing";
import { BLOG_POSTS, BlogPost, CategoryType } from "@/data/posts";

interface BlogPageContentProps {
  initialPosts?: BlogPost[];
}

export const BlogPageContent: React.FC<BlogPageContentProps> = ({
  initialPosts = BLOG_POSTS,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("Todos");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleResetFilter = () => {
    setSelectedCategory("Todos");
    setSearchQuery("");
  };

  // Contagem de posts na categoria selecionada
  const countForCurrentCategory =
    selectedCategory === "Todos"
      ? initialPosts.length
      : initialPosts.filter((p) => p.category === selectedCategory).length;

  return (
    <main className="min-h-screen relative z-10 bg-[#FAFAFA] flex flex-col justify-between">
      {/* Navbar Oficial */}
      <Navbar />

      <div className="flex-1">
        {/* Hero Section do Blog com Título Centralizado e Pílulas de Filtro */}
        <BlogHero
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalPosts={countForCurrentCategory}
        />

        {/* Seção Principal de Listagem com Grid 3x2x1 e Título Alinhado à Esquerda */}
        <BlogListing
          initialPosts={initialPosts}
          selectedCategory={selectedCategory}
          onResetFilter={handleResetFilter}
          searchQuery={searchQuery}
        />
      </div>

      {/* Footer Oficial com Gradiente e Selos de Certificação */}
      <Footer />
    </main>
  );
};

export default BlogPageContent;
