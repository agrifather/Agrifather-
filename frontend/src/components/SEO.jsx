import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  name = 'Agrifather', 
  type = 'website',
  keywords = 'agriculture, farming, AI pest identification, crop advisory, mandi prices, weather forecast'
}) => {
  const fullTitle = title ? `${title} | ${name}` : name;
  const defaultDescription = "Agrifather provides farmers with advanced AI tools for pest identification, weather forecasting, mandi prices, and crop advisory.";

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{fullTitle}</title>
      <meta name='description' content={description || defaultDescription} />
      <meta name='keywords' content={keywords} />
      
      {/* Open Graph / Facebook tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      
      {/* Twitter tags */}
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
    </Helmet>
  );
};

export default SEO;
