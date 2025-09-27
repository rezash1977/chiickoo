
import React from 'react';
import Layout from '../components/layout/Layout';
import CategoryList from '../components/home/CategoryList';
import TaglineSection from '../components/home/TaglineSection';
import FeaturedAds from '../components/home/FeaturedAds';

const Index: React.FC = () => {
  return (
    <Layout>
      <div className="pb-16">
        <CategoryList />
        <TaglineSection />
        <FeaturedAds />
      </div>
    </Layout>
  );
};

export default Index;
