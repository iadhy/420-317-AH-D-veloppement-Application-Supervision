# Séance 6 — pistes de réponse

## Pourquoi measures n'a pas d'écriture

Personne, côté humain, ne crée une mesure. Elle est produite par le capteur (simulé
aujourd'hui, un objet connecté réel à la séance 14) et enregistrée directement par le service.
Exposer `POST /api/measures` créerait une route qu'aucun client légitime n'appellerait, et
qu'un client malveillant pourrait utiliser pour injecter de fausses mesures.
