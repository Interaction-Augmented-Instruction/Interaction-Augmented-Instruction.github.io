<script setup lang="ts">
const authors = [
  {
    name: 'Leixian Shen',
    orcid: '0000-0003-1084-4912',
    affiliation: 'The Hong Kong University of Science and Technology',
    location: 'Hong Kong SAR, China',
    email: 'lshenaj@connect.ust.hk',
    isCorresponding: true
  },
  {
    name: 'Yifang Wang',
    orcid: '0000-0001-6267-9440',
    affiliation: 'Florida State University',
    location: 'Tallahassee, Florida, United States',
    email: 'yifang.wang@fsu.edu'
  },
  {
    name: 'Huamin Qu',
    orcid: '0000-0002-3344-9694',
    affiliation: 'The Hong Kong University of Science and Technology',
    location: 'Hong Kong SAR, China',
    email: 'huamin@cse.ust.hk'
  },
  {
    name: 'Xing Xie',
    orcid: '0000-0002-8608-8482',
    affiliation: 'Microsoft Research Asia',
    location: 'Beijing, China',
    email: 'xingx@microsoft.com'
  },
  {
    name: 'Haotian Li',
    orcid: '0000-0001-9547-3449',
    affiliation: 'Microsoft Research Asia',
    location: 'Beijing, China',
    email: 'haotian.li@microsoft.com',
    isCorresponding: true
  }
]

const abstract = `Text prompt is the most common way for human-generative AI (GenAI) communication. Though convenient, it is challenging to convey fine-grained and referential intent. One promising solution is to combine text prompts with precise GUI interactions, like brushing and clicking. However, there lacks a formal model to model synergistic designs between prompts and interactions, hindering their comparison and innovation. To fill this gap, via an iterative and deductive process, we develop the Interaction-Augmented Instruction (IAI) model, a compact entity-relation graph formalizing how the combination of interactions and text prompts enhances human-generative AI communication. With the model, we distill twelve recurring and composable atomic interaction paradigms from prior tools, verifying our model's capability to facilitate systematic design characterization and comparison. Case studies further demonstrate the model's utility in applying, refining, and extending these paradigms. These results illustrate our IAI model's descriptive, discriminative, and generative power for shaping future GenAI systems.`
</script>

<template>
  <section class="paper-promotion">
    <!-- Conference Badge -->
    <div class="conference-badge">
      <span class="badge-text">ACM CHI 2026</span>
    </div>

    <!-- Paper Title -->
    <h1 class="paper-title">
      Interaction-Augmented Instruction: Modeling the Synergy of <span class="highlight-prompts">Prompts</span> and <span class="highlight-interactions">Interactions</span> in Human-GenAI Collaboration
    </h1>

    <!-- Authors -->
    <div class="authors-section">
      <div class="authors-list">
        <div v-for="(author, index) in authors" :key="author.name" class="author-item">
          <div class="author-name-row">
            <a :href="`https://orcid.org/${author.orcid}`" target="_blank" class="author-name">
              {{ author.name }}
            </a>
          </div>
          <div class="author-affiliation">{{ author.affiliation }}</div>
        </div>
      </div>
      <div class="venue-info">
        The ACM CHI Conference on Human Factors in Computing Systems (CHI'26)
      </div>
    </div>

    <!-- Teaser Image -->
    <div class="teaser-section">
      <div class="teaser-container">
        <img src="/teaser.png" alt="Paper Teaser" class="teaser-image" />
      </div>
    </div>

    <!-- Abstract -->
    <div class="abstract-section">
      <h3 class="section-title">Abstract</h3>
      <p class="abstract-text">{{ abstract }}</p>
    </div>

    <!-- Video -->
    <div class="video-section">
      <h3 class="section-title">Introduction Video</h3>
      <div class="video-container">
        <video 
          controls 
          preload="auto"
          playsinline
          class="promo-video"
        >
          <source :src="'/video.mp4'" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <a href="/paper.pdf" target="_blank" class="action-btn pdf-btn">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>Paper (PDF)</span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.paper-promotion {
  background: white;
  padding: 48px 40px 40px;
  color: #1f2937;
  border-bottom: 1px solid #e5e7eb;
}

.conference-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #3b82f6;
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  margin-bottom: 20px;
  font-weight: 600;
  font-size: 13px;
}

.paper-title {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.3;
  max-width: 1000px;
  margin: 0 auto 28px;
  text-align: center;
  color: #1f2937;
}

.highlight-prompts {
  color: rgb(192, 79, 23);
}

.highlight-interactions {
  color: rgb(60, 124, 34);
}

.authors-section {
  margin-bottom: 36px;
}

.authors-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px 36px;
  max-width: 1200px;
  margin: 0 auto;
}

.venue-info {
  text-align: center;
  margin-top: 20px;
  font-size: 15px;
  color: #4b5563;
  font-weight: 500;
}

.author-item {
  text-align: center;
}

.author-name-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.author-name {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  font-size: 18px;
  transition: color 0.2s;
}

.author-name:hover {
  color: #2563eb;
  text-decoration: underline;
}

.corresponding-marker {
  font-size: 13px;
  color: #6b7280;
  cursor: help;
}

.author-affiliation {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  text-align: center;
}

.teaser-section {
  max-width: 1000px;
  margin: 0 auto 32px;
}

.teaser-container {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  background: white;
  border: 1px solid #e5e7eb;
}

.teaser-image {
  width: 100%;
  height: auto;
  display: block;
}

.abstract-section {
  max-width: 900px;
  margin: 0 auto 32px;
  background: #f8fafc;
  border-radius: 12px;
  padding: 24px 28px;
  border: 1px solid #e5e7eb;
}

.abstract-text {
  font-size: 14px;
  line-height: 1.8;
  text-align: justify;
  color: #4b5563;
  margin: 0;
}

.video-section {
  max-width: 800px;
  margin: 0 auto 32px;
}

.video-container {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  background: #000;
  border: 1px solid #e5e7eb;
  aspect-ratio: 16 / 9;
}

.promo-video {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  border: none;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.pdf-btn {
  background: #3b82f6;
  color: white;
}

.pdf-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* Responsive */
@media (max-width: 900px) {
  .paper-promotion {
    padding: 32px 20px 30px;
  }

  .paper-title {
    font-size: 1.5rem;
  }

  .authors-list {
    gap: 14px 24px;
  }

  .author-name {
    font-size: 14px;
  }

  .author-affiliation {
    font-size: 11px;
  }
}

@media (max-width: 600px) {
  .paper-title {
    font-size: 1.3rem;
  }

  .abstract-section {
    padding: 16px 18px;
  }

  .abstract-text {
    font-size: 13px;
  }
}
</style>
