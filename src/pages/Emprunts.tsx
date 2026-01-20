import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

type Emprunt = {
  id: string;
  livreId: string;
  userId: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  isNew?: boolean; // pour signaler un nouvel emprunt
};

export default function Emprunts() {
  const [emprunts, setEmprunts] = useState<Emprunt[]>([]);
  const [prevIds, setPrevIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);

  // Fonction pour FORCER endDate = startDate + 3 jours
  const calculateEndDate = (startDate: Date | undefined): Date | undefined => {
    if (!startDate) return undefined;
    
    // Créer une nouvelle date pour éviter les mutations
    const endDate = new Date(startDate);
    
    // Ajouter EXACTEMENT 3 jours (72 heures)
    endDate.setDate(endDate.getDate() + 3);
    
    // Forcer l'heure de fin à minuit (ou conserver l'heure originale si préféré)
    // endDate.setHours(23, 59, 59, 999); // Si vous voulez fin de journée
    
    return endDate;
  };

  // Formater la date pour l'affichage
  const formatDate = (date: Date | undefined): string => {
    if (!date) return 'Non spécifié';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formater la date avec l'heure
  const formatDateTime = (date: Date | undefined): string => {
    if (!date) return 'Non spécifié';
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculer la différence en jours entre deux dates
  const getDaysDifference = (start: Date, end: Date): number => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  useEffect(() => {
    const q = query(collection(db, 'Emprunts'), orderBy('startDate', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      snap => {
        const toDate = (t: any) =>
          t && typeof t.toDate === 'function' ? t.toDate() : t ? new Date(t) : undefined;

        const items: Emprunt[] = snap.docs.map(d => {
          const data = d.data() as any;

          const start = toDate(data.startDate);
          
          // IGNORER COMPLÈTEMENT la date stockée dans Firestore
          // TOUJOURS calculer endDate = startDate + 3 jours
          let computedEnd: Date | undefined = undefined;
          
          if (start) {
            // FORCER le calcul à startDate + 3 jours
            computedEnd = calculateEndDate(start);
            
            // Log pour déboguer si nécessaire
            const storedEnd = toDate(data.endDate);
            if (storedEnd) {
              const daysDiff = getDaysDifference(start, storedEnd);
              if (daysDiff !== 3) {
                console.warn(`Emprunt ${d.id}: La date stockée (${formatDate(storedEnd)}) 
                  est à ${daysDiff} jours de la date de début (${formatDate(start)}). 
                  Forcé à: ${formatDate(computedEnd)}`);
              }
            }
          }

          return {
            id: d.id,
            livreId: data.livreId || '',
            userId: data.userId || '',
            status: data.status || '',
            startDate: start,
            endDate: computedEnd, // TOUJOURS calculé comme startDate + 3 jours
            isNew: !prevIds.has(d.id),
          };
        });

        // Mettre à jour prevIds pour la prochaine comparaison
        setPrevIds(new Set(items.map(e => e.id)));

        // Mettre à jour les emprunts
        setEmprunts(items);

        // Supprimer le statut "nouveau" après 5 secondes
        items.forEach((e, idx) => {
          if (e.isNew) {
            setTimeout(() => {
              setEmprunts(prev => {
                const copy = [...prev];
                if (copy[idx]) copy[idx].isNew = false;
                return copy;
              });
            }, 5000);
          }
        });
      },
      err => {
        console.error('Erreur écoute emprunts', err);
        setMessage('Erreur lors de la synchronisation des emprunts.');
        setTimeout(() => setMessage(null), 3000);
      }
    );

    return () => unsubscribe(); // cleanup à la destruction du composant
  }, [prevIds]);

  // Fonction pour calculer si un emprunt est en retard
  const isOverdue = (endDate: Date | undefined): boolean => {
    if (!endDate) return false;
    const now = new Date();
    return now > endDate;
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', borderBottom: '2px solid #4CAF50', paddingBottom: '10px' }}>
        📚 Gestion des Emprunts (Temps Réel)
      </h1>
      
      <div style={{
        backgroundColor: '#e8f5e9',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #c8e6c9'
      }}>
        <h3 style={{ marginTop: 0, color: '#2e7d32' }}>📋 Règle de Calcul des Dates</h3>
        <p style={{ margin: '5px 0', color: '#555' }}>
          <strong>Durée d'emprunt :</strong> <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>3 jours exactement</span>
        </p>
        <p style={{ margin: '5px 0', color: '#555' }}>
          <strong>Calcul :</strong> Date de retour = Date d'emprunt + 3 jours
        </p>
        <p style={{ margin: '5px 0', fontSize: '14px', color: '#777', fontStyle: 'italic' }}>
          Note: Cette règle est appliquée automatiquement, même si d'autres dates sont stockées.
        </p>
      </div>
      
      {message && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '15px',
          border: '1px solid #ef9a9a'
        }}>
          {message}
        </div>
      )}
      
      {/* Statistiques */}
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '12px',
          borderRadius: '6px',
          flex: '1',
          minWidth: '200px'
        }}>
          <h4 style={{ marginTop: 0, color: '#333' }}>📊 Statistiques</h4>
          <p><strong>Total des emprunts :</strong> {emprunts.length}</p>
          <p><strong>Emprunts en cours :</strong> {emprunts.filter(e => e.status !== 'retourné').length}</p>
          <p><strong>Emprunts en retard :</strong> {
            emprunts.filter(e => e.endDate && isOverdue(e.endDate) && e.status !== 'retourné').length
          }</p>
        </div>
      </div>
      
      {/* Liste des emprunts */}
      <h2 style={{ color: '#333', marginBottom: '15px' }}>📖 Liste des Emprunts</h2>
      
      {emprunts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          color: '#777'
        }}>
          <p>Aucun emprunt à afficher pour le moment.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '15px',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
        }}>
          {emprunts.map(e => {
            const isLate = e.endDate && isOverdue(e.endDate) && e.status !== 'retourné';
            
            return (
              <div
                key={e.id}
                style={{
                  backgroundColor: e.isNew ? '#d4edda' : 
                                  isLate ? '#f8d7da' : 
                                  e.status === 'retourné' ? '#e8f5e9' : '#ffffff',
                  padding: '15px',
                  borderRadius: '8px',
                  border: `1px solid ${
                    e.isNew ? '#c3e6cb' : 
                    isLate ? '#f5c6cb' : 
                    e.status === 'retourné' ? '#c8e6c9' : '#ddd'
                  }`,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {e.isNew && (
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '5px 10px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    borderBottomLeftRadius: '8px'
                  }}>
                    NOUVEAU
                  </div>
                )}
                
                {isLate && (
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    padding: '5px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    ⚠️ EN RETARD
                  </div>
                )}
                
                <div style={{ 
                  marginBottom: '10px',
                  paddingTop: isLate ? '25px' : '0'
                }}>
                  <h3 style={{ 
                    margin: '0 0 10px 0', 
                    color: '#333',
                    fontSize: '18px'
                  }}>
                    {e.livreId}
                  </h3>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#555' }}>👤 Usager:</strong> {e.userId}
                  </div>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#555' }}>📊 Statut:</strong> 
                    <span style={{
                      display: 'inline-block',
                      marginLeft: '8px',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: 
                        e.status === 'retourné' ? '#28a745' :
                        e.status === 'en cours' ? '#17a2b8' :
                        '#ffc107',
                      color: 'white'
                    }}>
                      {e.status?.toUpperCase() || 'INCONNU'}
                    </span>
                  </div>
                </div>
                
                {/* Dates */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '10px',
                  borderRadius: '6px',
                  marginBottom: '10px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '5px'
                  }}>
                    <span style={{ color: '#555' }}><strong>📅 Emprunté le:</strong></span>
                    <span style={{ fontWeight: 'bold' }}>{formatDateTime(e.startDate)}</span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      color: isLate ? '#dc3545' : '#555',
                      fontWeight: 'bold'
                    }}>
                      <strong>⏰ Retour prévu:</strong>
                    </span>
                    <span style={{ 
                      fontWeight: 'bold',
                      color: isLate ? '#dc3545' : '#28a745',
                      fontSize: isLate ? '16px' : '14px'
                    }}>
                      {formatDateTime(e.endDate)}
                    </span>
                  </div>
                  
                  {/* Affichage de la durée calculée */}
                  {e.startDate && e.endDate && (
                    <div style={{
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: '1px dashed #ddd',
                      fontSize: '12px',
                      color: '#6c757d',
                      textAlign: 'center'
                    }}>
                      Durée d'emprunt: 3 jours exactement
                    </div>
                  )}
                </div>
                
                {/* Indicateur de jours restants */}
                {e.endDate && e.status !== 'retourné' && !isLate && (
                  <div style={{
                    textAlign: 'center',
                    fontSize: '13px',
                    color: '#17a2b8'
                  }}>
                    {(() => {
                      const now = new Date();
                      const diffTime = e.endDate.getTime() - now.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays > 0) {
                        return `⏳ ${diffDays} jour${diffDays > 1 ? 's' : ''} restant${diffDays > 1 ? 's' : ''}`;
                      } else if (diffDays === 0) {
                        return '⏳ Dernier jour aujourd\'hui!';
                      }
                      return '';
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}