import { Router } from 'express';

const router = Router();

router.get('/runs', (_req, res) => {
  res.json({ placeholder: true, endpoint: '/runs', description: 'List recent manual QA runs.' });
});

router.get('/runs', (_req, res) => {
  res.json({ placeholder: true, endpoint: '/runs', description: 'Return run summary and lifecycle stage counts.' });
});

router.get('/runs/checks', (_req, res) => {
  res.json({ placeholder: true, endpoint: '/runs/checks', description: 'Return check results with filtering by stage/status/severity.' });
});

router.get('/runs/artifacts', (_req, res) => {
  res.json({ placeholder: true, endpoint: '/runs/artifacts', description: 'Return artifact inventory for the run.' });
});

router.get('/runs/evidence', (_req, res) => {
  res.json({ placeholder: true, endpoint: '/runs/evidence', description: 'Return bounded evidence entries with optional source/check filtering.' });
});

export default router;
