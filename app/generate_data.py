import pandas as pd
import json
import numpy as np

df = pd.read_csv('../data/cleaned_marketing_data_full.csv')
df['CampaignChannel'] = df['CampaignChannel'].str.strip().str.lower()
df['CampaignType'] = df['CampaignType'].str.strip().str.lower()
df['Gender'] = df['Gender'].str.strip()

# Build compact records for JS
records = []
for _, row in df.iterrows():
    records.append({
        'id': int(row['CustomerID']),
        'age': int(row['Age']),
        'gender': row['Gender'],
        'income': int(row['Income']),
        'channel': row['CampaignChannel'],
        'type': row['CampaignType'],
        'spend': round(float(row['AdSpend']), 2),
        'ctr': round(float(row['ClickThroughRate']), 4),
        'cvr': round(float(row['ConversionRate']), 4),
        'visits': int(row['WebsiteVisits']),
        'pages': round(float(row['PagesPerVisit']), 2),
        'time': round(float(row['TimeOnSite']), 2),
        'shares': int(row['SocialShares']),
        'email_opens': int(row['EmailOpens']),
        'email_clicks': int(row['EmailClicks']),
        'prev_purchase': int(row['PreviousPurchases']),
        'loyalty': int(row['LoyaltyPoints']),
        'conv': int(row['Conversion'])
    })

# Age distribution bins
age_bins = list(range(18, 72, 3))
age_hist, _ = np.histogram(df['Age'], bins=age_bins)
age_labels = [f"{age_bins[i]}-{age_bins[i+1]-1}" for i in range(len(age_bins)-1)]

# Correlation matrix of numeric columns
num_cols = ['Age', 'Income', 'AdSpend', 'ClickThroughRate', 'ConversionRate',
            'WebsiteVisits', 'PagesPerVisit', 'TimeOnSite', 'SocialShares',
            'EmailOpens', 'EmailClicks', 'PreviousPurchases', 'LoyaltyPoints', 'Conversion']
corr = df[num_cols].corr().round(3)
corr_labels = [c.replace('ClickThroughRate','CTR').replace('ConversionRate','CVR')
               .replace('WebsiteVisits','Visits').replace('PagesPerVisit','Pages')
               .replace('TimeOnSite','TimeOnSite').replace('SocialShares','Shares')
               .replace('EmailOpens','EmailOpens').replace('EmailClicks','EmailClicks')
               .replace('PreviousPurchases','PrevPurchase').replace('LoyaltyPoints','Loyalty') for c in num_cols]
corr_matrix = corr.values.tolist()

# AdSpend distribution per channel
adspend_by_channel = {}
for ch in df['CampaignChannel'].unique():
    vals = df[df['CampaignChannel']==ch]['AdSpend'].tolist()
    adspend_by_channel[ch] = {
        'min': round(float(np.min(vals)), 2),
        'q1': round(float(np.percentile(vals, 25)), 2),
        'median': round(float(np.median(vals)), 2),
        'q3': round(float(np.percentile(vals, 75)), 2),
        'max': round(float(np.max(vals)), 2),
        'mean': round(float(np.mean(vals)), 2)
    }

# Stats per channel
channel_stats = {}
for ch in df['CampaignChannel'].unique():
    sub = df[df['CampaignChannel']==ch]
    channel_stats[ch] = {
        'total': int(len(sub)),
        'converted': int(sub['Conversion'].sum()),
        'cr': round(float(sub['Conversion'].mean()), 4),
        'avg_ctr': round(float(sub['ClickThroughRate'].mean()), 4),
        'avg_spend': round(float(sub['AdSpend'].mean()), 2),
        'avg_visits': round(float(sub['WebsiteVisits'].mean()), 2),
        'avg_time': round(float(sub['TimeOnSite'].mean()), 2),
        'avg_cvr': round(float(sub['ConversionRate'].mean()), 4),
        'avg_pages': round(float(sub['PagesPerVisit'].mean()), 2),
        'avg_loyalty': round(float(sub['LoyaltyPoints'].mean()), 2),
    }

# Campaign type stats
type_stats = {}
for t in df['CampaignType'].unique():
    sub = df[df['CampaignType']==t]
    type_stats[t] = {
        'total': int(len(sub)),
        'converted': int(sub['Conversion'].sum()),
        'cr': round(float(sub['Conversion'].mean()), 4),
        'avg_spend': round(float(sub['AdSpend'].mean()), 2),
    }

# Gender breakdown
gender_stats = {}
for g in df['Gender'].unique():
    sub = df[df['Gender']==g]
    gender_stats[g] = {
        'total': int(len(sub)),
        'converted': int(sub['Conversion'].sum()),
        'cr': round(float(sub['Conversion'].mean()), 4),
    }

overall = {
    'total': int(len(df)),
    'converted': int(df['Conversion'].sum()),
    'cr': round(float(df['Conversion'].mean()), 4),
    'total_spend': round(float(df['AdSpend'].sum()), 2),
    'avg_ctr': round(float(df['ClickThroughRate'].mean()), 4),
    'avg_cvr': round(float(df['ConversionRate'].mean()), 4),
    'avg_visits': round(float(df['WebsiteVisits'].mean()), 2),
    'avg_time': round(float(df['TimeOnSite'].mean()), 2),
}

output = {
    'records': records,
    'channel_stats': channel_stats,
    'type_stats': type_stats,
    'gender_stats': gender_stats,
    'overall': overall,
    'age_hist': {'labels': age_labels, 'values': age_hist.tolist()},
    'adspend_by_channel': adspend_by_channel,
    'corr': {'labels': corr_labels, 'matrix': corr_matrix}
}

js_content = 'const DASHBOARD_DATA = ' + json.dumps(output) + ';'

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

import os
size = os.path.getsize('data.js')
print(f'data.js created successfully: {size/1024:.1f} KB, {len(records)} records')
print('Channels found:', list(channel_stats.keys()))
print('Types found:', list(type_stats.keys()))
print('Overall stats:', overall)
